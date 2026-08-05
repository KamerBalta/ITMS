using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Infera.Application.Features.Users.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly ICurrentUserService _currentUser;

    public CreateUserCommandHandler(
        IAppDbContext db, IPasswordHasher passwordHasher, IEmailService emailService, ICurrentUserService currentUser)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateUserCommand request, CancellationToken ct)
    {
        var emailExists = await _db.Users.AnyAsync(u => u.Email == request.Email, ct);
        if (emailExists)
            throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");

        // PM yalnizca kendi projesi icin kullanici olusturabilir -- Admin sinirsiz.
        if (!_currentUser.IsAdmin)
        {
            if (request.ProjectId is null)
                throw new UnauthorizedAccessException("Project Manager yalnızca bir projeye bağlı kullanıcı oluşturabilir.");

            var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
                ?? throw new KeyNotFoundException("Proje bulunamadı.");

            if (project.OwnerId != _currentUser.UserId)
                throw new UnauthorizedAccessException("Yalnızca kendi projeniz için kullanıcı oluşturabilirsiniz.");
        }

        if (request.ProjectId is not null && request.TeamId is null)
            throw new InvalidOperationException("Bir projeye atama yapmak için takım da belirtilmelidir.");

        if (request.TeamId is not null)
        {
            var teamExists = await _db.Teams.AnyAsync(t => t.Id == request.TeamId, ct);
            if (!teamExists)
                throw new KeyNotFoundException("Takım bulunamadı.");
        }

        if (request.ProjectId is not null && request.TeamId is not null)
        {
            // DB-009: takim, projeye atanmis olmali
            var teamAssignedToProject = await _db.ProjectTeams
                .AnyAsync(pt => pt.ProjectId == request.ProjectId && pt.TeamId == request.TeamId, ct);
            if (!teamAssignedToProject)
                throw new InvalidOperationException("Belirtilen takım bu projeye atanmamış.");
        }

        // Kullanilamaz bir placeholder sifre -- kullanici aktivasyon tamamlayana kadar hicbir sifreyle giris yapamaz.
        var placeholderPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

        var rawActivationToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var activationTokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawActivationToken)));

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Title = request.Title,
            PasswordHash = _passwordHasher.Hash(placeholderPassword),
            IsActive = true,
            MustChangePassword = true,
            ActivationTokenHash = activationTokenHash,
            ActivationTokenExpiresAt = DateTime.UtcNow.AddDays(7),
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        if (request.TeamId is not null)
        {
            var alreadyMember = await _db.TeamMembers
                .AnyAsync(tm => tm.TeamId == request.TeamId && tm.UserId == user.Id, ct);
            if (!alreadyMember)
            {
                _db.TeamMembers.Add(new TeamMember
                {
                    TeamId = request.TeamId.Value,
                    UserId = user.Id,
                    TeamRole = request.TeamRole ?? "Backend Developer",
                });
            }
        }

        if (request.ProjectId is not null && request.TeamId is not null)
        {
            _db.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = request.ProjectId.Value,
                TeamId = request.TeamId.Value,
                UserId = user.Id,
                ProjectRole = (ProjectRole)(request.ProjectRole ?? 1), // varsayilan Developer
            });
        }

        await _db.SaveChangesAsync(ct);

        await _emailService.SendAsync(
            user.Email,
            "ITMS - Hesabınızı Aktifleştirin",
            $"Hesabınız oluşturuldu. Aktivasyon token'ı: {rawActivationToken} (7 gün geçerlidir). " +
            $"Şifrenizi belirlemek için /activate-account?token={rawActivationToken} adresine gidin.",
            ct);

        return user.Id;
    }
}